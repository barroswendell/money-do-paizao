using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class AccountModule
{
    private AccountModule()
    {
    }

    private AccountModule(Guid accountId, ProductModule module)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Module = module;
        Active = true;
        ActivatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Account? Account { get; private set; }
    public ProductModule Module { get; private set; }
    public bool Active { get; private set; }
    public DateTime ActivatedAtUtc { get; private set; }

    public static AccountModule Create(Guid accountId, ProductModule module) => new(accountId, module);
}
