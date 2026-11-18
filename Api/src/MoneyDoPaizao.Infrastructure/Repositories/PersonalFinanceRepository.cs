using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class PersonalFinanceRepository(MoneyDoPaizaoDbContext context) : IPersonalFinanceRepository
{
    public async Task<IReadOnlyList<FinanceEntry>> GetEntriesAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.FinanceEntries
            .Where(item => item.AccountId == accountId)
            .AsNoTracking()
            .OrderByDescending(item => item.EntryDate)
            .ThenByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(FinanceEntry entry, CancellationToken cancellationToken = default)
    {
        await context.FinanceEntries.AddAsync(entry, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => context.SaveChangesAsync(cancellationToken);
}
