using MoneyDoPaizao.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class AccountRepository(MoneyDoPaizaoDbContext context) : IAccountRepository
{
    public async Task AddAsync(Account account, CancellationToken cancellationToken = default)
    {
        await context.Accounts.AddAsync(account, cancellationToken);
    }

    public Task<Account?> GetByIdAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return context.Accounts.SingleOrDefaultAsync(item => item.Id == accountId, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return context.SaveChangesAsync(cancellationToken);
    }
}
