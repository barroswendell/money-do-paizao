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
    private const int InstallmentsPerPage = 20;
    private static readonly TimeZoneInfo SalesTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

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
        return Map(sale, customer.Name, product, Today());
    }

    public async Task<IReadOnlyList<SaleResponse>> GetSalesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var sales = await saleRepository.GetAllAsync(accountId, cancellationToken);
        var today = Today();
        return sales.Select(sale => Map(sale, today)).ToList();
    }

    public async Task<SaleResponse> MarkAsPaidAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default)
    {
        var sale = await saleRepository.GetByIdAsync(accountId, id, cancellationToken)
            ?? throw new BusinessValidationException("Venda não encontrada.");
        if (sale.Status != SaleStatus.Paid)
            throw new BusinessValidationException("Registre o pagamento de cada parcela nos detalhes da venda.");

        return Map(sale, Today());
    }

    public async Task<SaleInstallmentPageResponse?> GetInstallmentsAsync(Guid accountId, Guid id, int page, CancellationToken cancellationToken = default)
    {
        var sale = await saleRepository.GetByIdAsync(accountId, id, cancellationToken);
        if (sale is null) return null;
        if (sale.ScheduledInstallmentCount == 0)
            throw new BusinessValidationException("Esta venda foi feita à vista.");

        return MapInstallmentPage(sale, page);
    }

    private static SaleInstallmentPageResponse MapInstallmentPage(Sale sale, int page)
    {
        var totalPages = (sale.ScheduledInstallmentCount - 1) / InstallmentsPerPage + 1;
        page = Math.Clamp(page, 1, totalPages);
        var offset = (page - 1) * InstallmentsPerPage;
        var payments = sale.InstallmentPayments.ToDictionary(payment => payment.Number);
        var count = Math.Min(InstallmentsPerPage, sale.ScheduledInstallmentCount - offset);
        var today = Today();
        var installments = Enumerable.Range(offset + 1, count)
            .Select(number => MapInstallment(sale, number, payments.GetValueOrDefault(number), today)).ToList();
        return new SaleInstallmentPageResponse(Map(sale, today), page, totalPages, installments);
    }

    public async Task<SaleInstallmentPageResponse?> PayInstallmentAsync(Guid accountId, Guid id, int number, Guid userId, string userName, CancellationToken cancellationToken = default)
    {
        var sale = await saleRepository.RegisterInstallmentPaymentAsync(accountId, id, currentSale =>
        {
            if (number < 1 || number > currentSale.ScheduledInstallmentCount)
                throw new BusinessValidationException("Parcela não encontrada nesta venda.");

            var now = DateTime.UtcNow;
            // PostgreSQL stores timestamps at microsecond precision.
            var paidAtUtc = now.AddTicks(-(now.Ticks % TimeSpan.TicksPerMicrosecond));
            return currentSale.PayInstallment(number, userId, userName, paidAtUtc);
        }, cancellationToken);
        return sale is null ? null : MapInstallmentPage(sale, (number - 1) / InstallmentsPerPage + 1);
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
            sales.Sum(item => item.ReceivedAmount),
            sales.Sum(item => item.Amount - item.ReceivedAmount));
    }

    private static Sale CreateInstallmentSale(Guid accountId, SaleCreateRequest request)
    {
        if (request.DueDate is { } dueDate && DateOnly.FromDateTime(dueDate) < Today())
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

    private static DateOnly Today() => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, SalesTimeZone));

    private static bool IsOverdue(Sale sale, DateOnly today)
    {
        if (sale.Status == SaleStatus.Paid || sale.DueDate is null || sale.ScheduledInstallmentCount == 0) return false;

        var nextUnpaid = 1;
        foreach (var payment in sale.InstallmentPayments.OrderBy(item => item.Number))
        {
            if (payment.Number != nextUnpaid) break;
            nextUnpaid++;
        }

        return sale.GetInstallmentDueDate(nextUnpaid) is { } dueDate && dueDate < today;
    }

    private static SaleInstallmentResponse MapInstallment(Sale sale, int number, SaleInstallmentPayment? payment, DateOnly today)
    {
        var dueDate = sale.GetInstallmentDueDate(number);
        var paid = payment is not null || sale.Status == SaleStatus.Paid;
        return new SaleInstallmentResponse(number, payment?.Amount ?? sale.GetInstallmentAmount(number), dueDate, paid,
            !paid && dueDate is { } date && date < today, payment?.PaidAtUtc, payment?.PaidByUserId, payment?.PaidByUserName);
    }

    private static SaleResponse Map(Sale sale, DateOnly today) => Map(sale, sale.Customer?.Name ?? "Cliente", sale.Product!, today);

    private static SaleResponse Map(Sale sale, string customerName, Product product, DateOnly today) => new(
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
        sale.LastInstallmentAmount,
        sale.ScheduledInstallmentCount,
        sale.PaidInstallmentCount,
        sale.ReceivedAmount,
        IsOverdue(sale, today));
}

public interface ISalesService
{
    Task<ProductResponse> CreateProductAsync(Guid accountId, ProductCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ProductResponse>> GetProductsAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<SaleResponse> CreateSaleAsync(Guid accountId, SaleCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SaleResponse>> GetSalesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<SaleResponse> MarkAsPaidAsync(Guid accountId, Guid id, CancellationToken cancellationToken = default);
    Task<SaleInstallmentPageResponse?> GetInstallmentsAsync(Guid accountId, Guid id, int page, CancellationToken cancellationToken = default);
    Task<SaleInstallmentPageResponse?> PayInstallmentAsync(Guid accountId, Guid id, int number, Guid userId, string userName, CancellationToken cancellationToken = default);
    Task<SalesDashboardResponse> GetDashboardAsync(Guid accountId, CancellationToken cancellationToken = default);
}
