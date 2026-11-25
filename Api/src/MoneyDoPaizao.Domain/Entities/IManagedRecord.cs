using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public interface IManagedRecord
{
    Guid Id { get; }
    Guid AccountId { get; }
    DateTime? DeactivatedAtUtc { get; }
    void Deactivate(DateTime atUtc);
}

public enum RecordKind
{
    Customer,
    Loan,
    PartyEvent,
    PartyTheme,
    PartyProduct,
    Sale,
    Product,
    FinanceEntry
}

public static class RecordModule
{
    public static ProductModule? For(RecordKind kind) => kind switch
    {
        RecordKind.Customer => null,
        RecordKind.Loan => ProductModule.Loans,
        RecordKind.PartyEvent or RecordKind.PartyTheme or RecordKind.PartyProduct => ProductModule.Parties,
        RecordKind.Sale or RecordKind.Product => ProductModule.Sales,
        RecordKind.FinanceEntry => ProductModule.PersonalFinance,
        _ => throw new ArgumentOutOfRangeException(nameof(kind))
    };
}
