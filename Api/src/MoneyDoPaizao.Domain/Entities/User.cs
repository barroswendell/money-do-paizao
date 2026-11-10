using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Domain.Entities;

public sealed class User
{
    private User()
    {
    }

    private User(string name, string email, string cpf, DateTime birthDate, string passwordHash, UserRole role)
    {
        Id = Guid.NewGuid();
        Name = name.Trim();
        Email = email.Trim().ToLowerInvariant();
        Cpf = new string(cpf.Where(char.IsDigit).ToArray());
        BirthDate = birthDate.Date;
        PasswordHash = passwordHash;
        Role = role;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string Cpf { get; private set; } = string.Empty;
    public DateTime BirthDate { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public UserRole Role { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    public static User Create(string name, string email, string cpf, DateTime birthDate, string passwordHash, UserRole role)
    {
        return new User(name, email, cpf, birthDate, passwordHash, role);
    }

    public void ChangePasswordHash(string passwordHash)
    {
        PasswordHash = passwordHash;
    }
}
