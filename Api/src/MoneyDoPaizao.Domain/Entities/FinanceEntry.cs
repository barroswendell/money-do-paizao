using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class FinanceEntry
{
    private FinanceEntry()
    {
    }

    private FinanceEntry(
        Guid accountId,
        FinanceEntryType type,
        decimal amount,
        DateTime entryDate,
        string category,
        string? description)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Type = type;
        Amount = amount;
        EntryDate = entryDate.Date;
        Category = category.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public FinanceEntryType Type { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime EntryDate { get; private set; }
    public string Category { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static FinanceEntry Create(
        Guid accountId,
        FinanceEntryType type,
        decimal amount,
        DateTime entryDate,
        string category,
        string? description) => new(accountId, type, amount, entryDate, category, description);
}
