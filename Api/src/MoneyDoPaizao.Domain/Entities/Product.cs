namespace MoneyDoPaizao.Domain.Entities;

public sealed class Product : IManagedRecord
{
    public DateTime? DeactivatedAtUtc { get; private set; }

    public void Deactivate(DateTime atUtc) => DeactivatedAtUtc ??= atUtc;

    public void Rename(string name) => Name = name.Trim();

    private Product()
    {
    }

    private Product(Guid accountId, string name)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Name = name.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Brand { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static Product Create(Guid accountId, string name) => new(accountId, name);
}
