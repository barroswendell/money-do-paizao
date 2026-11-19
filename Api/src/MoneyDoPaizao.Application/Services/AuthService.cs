using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class AuthService(
    IUserRepository userRepository,
    IAccountRepository accountRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRegisterRequest(request);

        var email = request.Email.Trim().ToLowerInvariant();
        var phone = new string((request.Phone ?? string.Empty).Where(char.IsDigit).ToArray());

        if (await userRepository.GetByEmailAsync(email, cancellationToken) is not null)
        {
            throw new AuthValidationException("Este e-mail já está cadastrado.");
        }

        if (await userRepository.GetByPhoneAsync(phone, cancellationToken) is not null)
        {
            throw new AuthValidationException("Este telefone já está cadastrado.");
        }

        var modules = request.Modules.Distinct().ToArray();
        var account = Account.Create($"Conta de {request.Name.Trim()}", modules[0]);
        foreach (var module in modules.Skip(1))
        {
            account.AddModule(module);
        }
        await accountRepository.AddAsync(account, cancellationToken);

        var user = User.Create(
            account.Id,
            request.Name,
            email,
            null,
            phone,
            request.BirthDate,
            passwordHasher.Hash(request.Password),
            UserRole.Usuario);
        user.AttachAccount(account);

        await userRepository.AddAsync(user, cancellationToken);
        await accountRepository.SaveChangesAsync(cancellationToken);

        return tokenService.CreateToken(user, modules[0]);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new InvalidCredentialsException();
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userRepository.GetByEmailAsync(email, cancellationToken);

        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new InvalidCredentialsException();
        }

        return tokenService.CreateToken(user);
    }

    private static void ValidateRegisterRequest(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length < 3)
        {
            throw new AuthValidationException("Informe um nome válido.");
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !request.Email.Contains('@'))
        {
            throw new AuthValidationException("Informe um e-mail válido.");
        }

        var phone = new string((request.Phone ?? string.Empty).Where(char.IsDigit).ToArray());
        if (phone.Length is < 10 or > 11)
        {
            throw new AuthValidationException("Informe um telefone válido com DDD.");
        }

        if (request.BirthDate.Date >= DateTime.UtcNow.Date)
        {
            throw new AuthValidationException("Informe uma data de nascimento válida.");
        }

        if (request.Password.Length < 6)
        {
            throw new AuthValidationException("A senha deve ter pelo menos 6 caracteres.");
        }

        if (request.Password != request.ConfirmPassword)
        {
            throw new AuthValidationException("A confirmação de senha não confere.");
        }

        if (request.Modules is null || request.Modules.Count == 0)
        {
            throw new AuthValidationException("Escolha pelo menos um módulo para começar.");
        }

        if (request.Modules.Any(module => !Enum.IsDefined(module)))
        {
            throw new AuthValidationException("Um dos módulos selecionados é inválido.");
        }
    }
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
}
