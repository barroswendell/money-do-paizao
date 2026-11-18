using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class AccountModuleRepository(MoneyDoPaizaoDbContext context) : IAccountModuleRepository
{
    public async Task<IReadOnlyList<AccountModule>> GetByAccountIdAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.AccountModules
            .Where(item => item.AccountId == accountId && item.Active)
            .OrderBy(item => item.Module)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public Task<AccountModule?> GetAsync(Guid accountId, ProductModule module, CancellationToken cancellationToken = default)
    {
        return context.AccountModules.SingleOrDefaultAsync(item => item.AccountId == accountId && item.Module == module && item.Active, cancellationToken);
    }

    public async Task AddAsync(AccountModule accountModule, CancellationToken cancellationToken = default)
    {
        await context.AccountModules.AddAsync(accountModule, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => context.SaveChangesAsync(cancellationToken);
}
