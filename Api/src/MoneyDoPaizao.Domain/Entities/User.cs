using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class User
{
    private User()
    {
    }

    private User(Guid accountId, string name, string email, string cpf, DateTime birthDate, string passwordHash, UserRole role)
    {
        Id = Guid.NewGuid();
        AccountId = accountId;
        Name = name.Trim();
        Email = email.Trim().ToLowerInvariant();
        Cpf = new string(cpf.Where(char.IsDigit).ToArray());
        BirthDate = birthDate.Date;
        PasswordHash = passwordHash;
        Role = role;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Account? Account { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Cpf { get; private set; } = string.Empty;
    public DateTime BirthDate { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static User Create(Guid accountId, string name, string email, string cpf, DateTime birthDate, string passwordHash, UserRole role)
    {
        return new User(accountId, name, email, cpf, birthDate, passwordHash, role);
    }

    public void ChangePasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
    }

    public void AttachAccount(Account account)
    {
        Account = account;
    }
}
