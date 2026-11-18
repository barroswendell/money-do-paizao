using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Finance;

public sealed record FinanceEntryCreateRequest(
    FinanceEntryType Type,
    decimal Amount,
    DateTime EntryDate,
    string Category,
    string? Description);

public sealed record FinanceEntryResponse(
    Guid Id,
    FinanceEntryType Type,
    decimal Amount,
    DateTime EntryDate,
    string Category,
    string? Description,
    DateTime CreatedAtUtc);

public sealed record PersonalFinanceSummaryResponse(
    decimal MonthlyIncome,
    decimal MonthlyExpenses,
    decimal MonthlyBalance,
    int EntriesCount);
