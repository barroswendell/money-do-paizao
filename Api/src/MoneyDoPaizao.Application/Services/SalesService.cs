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
    private const decimal MaxSaleAmount = 9_999_999_999_999_999.99m;

    public async Task<ProductResponse> CreateProductAsync(Guid accountId, ProductCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length > 160)
            throw new BusinessValidationException("Informe o nome do produto com até 160 caracteres.");

        var product = Product.Create(accountId, request.Name);
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
        if (request.UnitPrice <= 0 || !IsMoney(request.UnitPrice))
            throw new BusinessValidationException("Informe um valor do produto maior que zero, com até duas casas decimais.");

        var customer = await customerRepository.GetByIdAsync(accountId, ProductModule.Sales, request.CustomerId, cancellationToken)
            ?? throw new BusinessValidationException("O cliente selecionado não foi encontrado.");
        var product = await productRepository.GetByIdAsync(accountId, request.ProductId, cancellationToken)
            ?? throw new BusinessValidationException("O produto selecionado não foi encontrado.");
        var sale = request.PaymentType == SalePaymentType.Cash
            ? Sale.CreateCash(accountId, customer.Id, product.Id, request.UnitPrice)
            : CreateInstallmentSale(accountId, request);
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
        return Map(sale, sale.Customer?.Name ?? "Cliente", sale.Product!);
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
            sales.Sum(item => item.Status == SaleStatus.Paid ? item.Amount : item.DownPaymentAmount ?? 0),
            sales.Where(item => item.Status == SaleStatus.Pending).Sum(item => item.Amount - (item.DownPaymentAmount ?? 0)));
    }

    private static Sale CreateInstallmentSale(Guid accountId, SaleCreateRequest request)
    {
        if (request.DueDate is { } dueDate && dueDate.Date < DateTime.UtcNow.Date)
            throw new BusinessValidationException("O vencimento da venda não pode estar no passado.");
        if (request.InstallmentCount is not > 0)
            throw new BusinessValidationException("Informe uma quantidade de parcelas maior que zero.");

        var downPayment = request.DownPaymentAmount ?? 0;
        if (!IsMoney(downPayment) || downPayment >= request.UnitPrice)
            throw new BusinessValidationException("A entrada deve ser menor que o valor do produto e ter até duas casas decimais.");

        var count = request.InstallmentCount.Value;
        var remaining = request.UnitPrice - downPayment;
        var installment = request.InstallmentAmount ?? decimal.Floor(remaining * 100 / count) / 100;
        if (installment <= 0 || !IsMoney(installment))
            throw new BusinessValidationException("Informe um valor de parcela maior que zero, com até duas casas decimais.");

        // An automatically divided sale preserves the product price to the cent.
        var lastInstallment = request.InstallmentAmount is null ? remaining - installment * (count - 1) : installment;
        var sale = Sale.CreateInstallment(accountId, request.CustomerId, request.ProductId, request.UnitPrice, downPayment,
            count, installment, lastInstallment == installment ? null : lastInstallment, request.DueDate);
        if (sale.Amount > MaxSaleAmount)
            throw new BusinessValidationException("O total da venda ultrapassa o valor máximo aceito.");
        return sale;
    }

    private static bool IsMoney(decimal amount) => amount >= 0 && amount <= MaxSaleAmount && decimal.Round(amount, 2) == amount;

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
        sale.PaidAtUtc,
        sale.UnitPrice ?? sale.Amount,
        sale.DownPaymentAmount ?? 0,
        sale.InstallmentCount,
        sale.InstallmentAmount,
        sale.LastInstallmentAmount);
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
