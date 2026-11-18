using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class AccountModuleService(
    IUserRepository userRepository,
    IAccountModuleRepository accountModuleRepository,
    ITokenService tokenService) : IAccountModuleService
{
    public async Task<IReadOnlyList<string>> GetModulesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var modules = await accountModuleRepository.GetByAccountIdAsync(accountId, cancellationToken);
        return modules.Select(item => item.Module.ToString()).ToList();
    }

    public async Task<AuthResponse> ActivateAsync(Guid userId, ProductModule module, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidCredentialsException();

        if (user.Account is null)
        {
            throw new BusinessValidationException("A conta do usuário não foi encontrada.");
        }

        var accountModule = await accountModuleRepository.GetAsync(user.AccountId, module, cancellationToken);
        if (accountModule is null)
        {
            accountModule = AccountModule.Create(user.AccountId, module);
            await accountModuleRepository.AddAsync(accountModule, cancellationToken);
            user.Account.Modules.Add(accountModule);
            await accountModuleRepository.SaveChangesAsync(cancellationToken);
        }

        return tokenService.CreateToken(user, module);
    }
}

public interface IAccountModuleService
{
    Task<IReadOnlyList<string>> GetModulesAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<AuthResponse> ActivateAsync(Guid userId, ProductModule module, CancellationToken cancellationToken = default);
}
