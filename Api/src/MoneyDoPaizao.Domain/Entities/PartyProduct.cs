namespace MoneyDoPaizao.Domain.Entities;

public sealed class PartyProduct : IManagedRecord
{
    public DateTime? DeactivatedAtUtc { get; private set; }

    public void Deactivate(DateTime atUtc) => DeactivatedAtUtc ??= atUtc;

    public void Update(string name, string? notes)
    {
        Name = name.Trim();
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }

    private PartyProduct()
    {
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Notes { get; private set; }

    public static PartyProduct Create(Guid accountId, string name, string? notes) => new()
    {
        Id = Guid.NewGuid(),
        AccountId = accountId,
        Name = name.Trim(),
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim()
    };
}
