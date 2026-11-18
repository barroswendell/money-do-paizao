using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Customer
{
    private Customer()
    {
    }

    private Customer(Guid accountId, ProductModule module, string name, bool hasReferral, string? referral)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Module = module;
        Name = name.Trim();
        HasReferral = hasReferral;
        Referral = hasReferral ? referral?.Trim() : null;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public ProductModule Module { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public bool HasReferral { get; private set; }
    public string? Referral { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public ICollection<Loan> Loans { get; private set; } = new List<Loan>();

    public static Customer Create(Guid accountId, ProductModule module, string name, bool hasReferral, string? referral)
    {
        return new Customer(accountId, module, name, hasReferral, referral);
    }
}
