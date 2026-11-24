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
    decimal? LastInstallmentAmount,
    int ScheduledInstallmentCount,
    int PaidInstallmentCount,
    decimal ReceivedAmount,
    bool IsOverdue);

public sealed record SaleInstallmentResponse(
    int Number,
    decimal Amount,
    DateOnly? DueDate,
    bool IsPaid,
    bool IsOverdue,
    DateTime? PaidAtUtc,
    Guid? PaidByUserId,
    string? PaidByUserName);

public sealed record SaleInstallmentPageResponse(SaleResponse Sale, int Page, int TotalPages, IReadOnlyList<SaleInstallmentResponse> Installments);

public sealed record SalesDashboardResponse(
    int TotalCustomers,
    int TotalProducts,
    int TotalSales,
    decimal TotalRevenue,
    decimal TotalReceived,
    decimal TotalPending);
