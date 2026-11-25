using System.Text.Json.Serialization;

namespace MoneyDoPaizao.Application.Parties;

public sealed record PartyThemeCreateRequest(string Name, string? Description);

public sealed record PartyThemeResponse(Guid Id, string Name, string? Description, DateTime CreatedAtUtc);

public sealed record PartyProductCreateRequest(string Name, string? Notes);

public sealed record PartyProductResponse(Guid Id, string Name, string? Notes);

public sealed record PartyEventProductRequest(Guid ProductId, decimal Amount, bool IsGift, Guid? Id = null);

public sealed record PartyEventProductResponse(Guid Id, Guid ProductId, string ProductName, decimal Amount, bool IsGift);

public sealed record PartyEventReceivedAmountRequest([property: JsonRequired] decimal ReceivedAmount);

public sealed record PartyEventCreateRequest(
    Guid CustomerId,
    Guid? ThemeId,
    DateTime EventDate,
    decimal TotalAmount,
    bool DepositReceived,
    decimal DepositAmount,
    string? Notes,
    IReadOnlyList<PartyEventProductRequest>? Products = null,
    decimal? ReceivedAmount = null);

public sealed record PartyEventResponse(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    Guid? ThemeId,
    string? ThemeName,
    DateTime EventDate,
    decimal TotalAmount,
    bool DepositReceived,
    decimal DepositAmount,
    decimal RemainingAmount,
    string? Notes,
    string Status,
    decimal BaseAmount,
    decimal ReceivedAmount,
    IReadOnlyList<PartyEventProductResponse> Products);

public sealed record PartyDashboardResponse(
    int UpcomingEvents,
    decimal MonthlyRevenue,
    decimal MonthlyDeposits,
    decimal MonthlyPending,
    string CurrentMonth,
    IReadOnlyList<PartyMonthResponse> Months);

public sealed record PartyMonthResponse(
    string Month,
    int EventCount,
    decimal TotalAmount,
    decimal ReceivedAmount,
    decimal RemainingAmount);
