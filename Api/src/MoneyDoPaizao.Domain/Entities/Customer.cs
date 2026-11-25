using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Customer : IManagedRecord
{
    public DateTime? DeactivatedAtUtc { get; private set; }

    public void Deactivate(DateTime atUtc) => DeactivatedAtUtc ??= atUtc;

    public void Update(string name, bool hasReferral, string? referral, string? phone)
    {
        Name = name.Trim();
        HasReferral = hasReferral;
        Referral = hasReferral ? referral?.Trim() : null;
        Phone = phone;
    }

    private Customer()
    {
    }

    private Customer(Guid accountId, ProductModule module, string name, bool hasReferral, string? referral, string phone)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Module = module;
        Name = name.Trim();
        Phone = phone;
        HasReferral = hasReferral;
        Referral = hasReferral ? referral?.Trim() : null;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public ProductModule Module { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Phone { get; private set; }
    public bool HasReferral { get; private set; }
    public string? Referral { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public ICollection<Loan> Loans { get; private set; } = new List<Loan>();

    public static Customer Create(Guid accountId, ProductModule module, string name, bool hasReferral, string? referral, string phone)
    {
        return new Customer(accountId, module, name, hasReferral, referral, phone);
    }
}
