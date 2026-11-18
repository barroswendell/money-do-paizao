using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class Account
{
    public const string DefaultPrimaryColor = "#071629";
    public const string DefaultSecondaryColor = "#D4A64A";

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
    public bool UseCustomTheme { get; private set; }
    public string PrimaryColor { get; private set; } = DefaultPrimaryColor;
    public string SecondaryColor { get; private set; } = DefaultSecondaryColor;
    public bool IsDarkMode { get; private set; }
    public ICollection<AccountModule> Modules { get; private set; } = new List<AccountModule>();

    public static Account Create(string name, ProductModule module)
    {
        var account = new Account(name, module);
        account.AddModule(module);
        return account;
    }

    public void AddModule(ProductModule module)
    {
        if (Modules.Any(item => item.Module == module && item.Active)) return;
        Modules.Add(AccountModule.Create(Id, module));
    }

    public void UpdateAppearance(bool useCustomTheme, string primaryColor, string secondaryColor, bool isDarkMode)
    {
        UseCustomTheme = useCustomTheme;
        PrimaryColor = primaryColor;
        SecondaryColor = secondaryColor;
        IsDarkMode = isDarkMode;
    }
}
