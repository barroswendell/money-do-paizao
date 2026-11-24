using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Sales;

public sealed record ProductCreateRequest(string Name);

public sealed record ProductResponse(Guid Id, string Name, string Brand, decimal Price, DateTime CreatedAtUtc);

public sealed record SaleCreateRequest(
    Guid CustomerId,
    Guid ProductId,
    SalePaymentType PaymentType,
    DateTime? DueDate,
    decimal UnitPrice,
    decimal? DownPaymentAmount,
    int? InstallmentCount,
    decimal? InstallmentAmount);

public sealed record SaleResponse(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    Guid ProductId,
    string ProductName,
    string ProductBrand,
    decimal Amount,
    SalePaymentType PaymentType,
    SaleStatus Status,
    DateTime? DueDate,
    DateTime SoldAtUtc,
    DateTime? PaidAtUtc,
    decimal UnitPrice,
    decimal DownPaymentAmount,
    int? InstallmentCount,
    decimal? InstallmentAmount,
    decimal? LastInstallmentAmount);

public sealed record SalesDashboardResponse(
    int TotalCustomers,
    int TotalProducts,
    int TotalSales,
    decimal TotalRevenue,
    decimal TotalReceived,
    decimal TotalPending);
