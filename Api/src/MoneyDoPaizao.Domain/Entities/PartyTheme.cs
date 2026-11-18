namespace MoneyDoPaizao.Domain.Entities;

public sealed class PartyTheme
{
    private PartyTheme()
    {
    }

    private PartyTheme(Guid accountId, string name, string? description)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Name = name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static PartyTheme Create(Guid accountId, string name, string? description) => new(accountId, name, description);
}
