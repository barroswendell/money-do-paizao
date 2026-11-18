using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Account
{
    private Account()
    {
    }

    private Account(string name, ProductModule module)
    {
        Id = Guid.NewGuid();
        Name = name.Trim();
        Module = module;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public ProductModule Module { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static Account Create(string name, ProductModule module) => new(name, module);
}
