using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class AuthService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        ValidateRegisterRequest(request);

        var email = request.Email.Trim().ToLowerInvariant();
        var cpf = new string(request.Cpf.Where(char.IsDigit).ToArray());

        if (await userRepository.GetByEmailAsync(email, cancellationToken) is not null)
        {
            throw new AuthValidationException("Este e-mail já está cadastrado.");
        }

        if (await userRepository.GetByCpfAsync(cpf, cancellationToken) is not null)
        {
            throw new AuthValidationException("Este CPF já está cadastrado.");
        }

        var user = User.Create(
            request.Name,
            email,
            cpf,
            request.BirthDate,
            passwordHasher.Hash(request.Password),
            UserRole.Usuario);

        await userRepository.AddAsync(user, cancellationToken);
        await userRepository.SaveChangesAsync(cancellationToken);

        return tokenService.CreateToken(user);
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

        var cpf = new string(request.Cpf.Where(char.IsDigit).ToArray());
        if (cpf.Length != 11)
        {
            throw new AuthValidationException("Informe um CPF válido.");
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
    }
}

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
}
