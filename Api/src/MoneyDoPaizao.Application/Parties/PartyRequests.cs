using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Parties;

public sealed record PartyThemeCreateRequest(string Name, string? Description);

public sealed record PartyThemeResponse(Guid Id, string Name, string? Description, DateTime CreatedAtUtc);

public sealed record PartyEventCreateRequest(
    Guid CustomerId,
    Guid? ThemeId,
    DateTime EventDate,
    decimal TotalAmount,
    bool DepositReceived,
    decimal DepositAmount,
    string? Notes);

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
    string Status);

public sealed record PartyDashboardResponse(
    int UpcomingEvents,
    decimal MonthlyRevenue,
    decimal MonthlyDeposits,
    decimal MonthlyPending);
