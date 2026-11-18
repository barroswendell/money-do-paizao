using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Sales;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class SalesService(
    IProductRepository productRepository,
    ISaleRepository saleRepository,
    ICustomerRepository customerRepository) : ISalesService
{
    public async Task<ProductResponse> CreateProductAsync(Guid accountId, ProductCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Brand))
            throw new BusinessValidationException("Informe o nome e a marca do produto.");
        if (request.Price <= 0)
            throw new BusinessValidationException("Informe um valor de produto maior que zero.");

        var product = Product.Create(accountId, request.Name, request.Brand, request.Price);
        await productRepository.AddAsync(product, cancellationToken);
        await productRepository.SaveChangesAsync(cancellationToken);
        return Map(product);
    }

    public async Task<IReadOnlyList<ProductResponse>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return (await productRepository.GetAllAsync(accountId, cancellationToken)).Select(Map).ToList();
    }

    public async Task<SaleResponse> CreateSaleAsync(Guid accountId, SaleCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (request.PaymentType is not SalePaymentType.Cash and not SalePaymentType.Installment)
            throw new BusinessValidationException("Escolha uma forma de pagamento válida.");

        var customer = await customerRepository.GetByIdAsync(accountId, ProductModule.Sales, request.CustomerId, cancellationToken)
            ?? throw new BusinessValidationException("O cliente selecionado não foi encontrado.");
        var product = await productRepository.GetByIdAsync(accountId, request.ProductId, cancellationToken)
            ?? throw new BusinessValidationException("O produto selecionado não foi encontrado.");
        if (request.PaymentType == SalePaymentType.Installment && request.DueDate.HasValue && request.DueDate.Value.Date < DateTime.UtcNow.Date)
            throw new BusinessValidationException("O vencimento da venda não pode estar no passado.");

        var sale = Sale.Create(accountId, customer.Id, product.Id, request.PaymentType, product.Price, request.DueDate);
        await saleRepository.AddAsync(sale, cancellationToken);
        await saleRepository.SaveChangesAsync(cancellationToken);
        return Map(sale, customer.Name, product);
    }

    public async Task<IReadOnlyList<SaleResponse>> GetSalesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return (await saleRepository.GetAllAsync(accountId, cancellationToken))
            .Select(item => Map(item, item.Customer?.Name ?? "Cliente", item.Product!)).ToList();
    }

    public async Task<SaleResponse> MarkAsPaidAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default)
    {
        var sale = await saleRepository.GetByIdAsync(accountId, id, cancellationToken)
            ?? throw new BusinessValidationException("Venda não encontrada.");
        sale.MarkAsPaid();
        await saleRepository.SaveChangesAsync(cancellationToken);
        var product = await productRepository.GetByIdAsync(accountId, sale.ProductId, cancellationToken);
        return Map(sale, "Cliente", product!);
    }

    public async Task<SalesDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var customers = await customerRepository.GetAllAsync(accountId, ProductModule.Sales, cancellationToken);
        var products = await productRepository.GetAllAsync(accountId, cancellationToken);
        var sales = await saleRepository.GetAllAsync(accountId, cancellationToken);
        return new SalesDashboardResponse(
            customers.Count,
            products.Count,
            sales.Count,
            sales.Sum(item => item.Amount),
            sales.Where(item => item.Status == SaleStatus.Paid).Sum(item => item.Amount),
            sales.Where(item => item.Status == SaleStatus.Pending).Sum(item => item.Amount));
    }

    private static ProductResponse Map(Product product) => new(product.Id, product.Name, product.Brand, product.Price, product.CreatedAtUtc);

    private static SaleResponse Map(Sale sale, string customerName, Product product) => new(
        sale.Id,
        sale.CustomerId,
        customerName,
        sale.ProductId,
        product.Name,
        product.Brand,
        sale.Amount,
        sale.PaymentType,
        sale.Status,
        sale.DueDate,
        sale.SoldAtUtc,
        sale.PaidAtUtc);
}

public interface ISalesService
{
    Task<ProductResponse> CreateProductAsync(Guid accountId, ProductCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductResponse>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<SaleResponse> CreateSaleAsync(Guid accountId, SaleCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SaleResponse>> GetSalesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<SaleResponse> MarkAsPaidAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default);
    Task<SalesDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default);
}
