using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class CustomerRepository(MoneyDoPaizaoDbContext context) : ICustomerRepository
{
    public async Task<IReadOnlyList<Customer>> GetAllAsync(Guid accountId, ProductModule module, CancellationToken cancellationToken = default)
    {
        return await context.Customers
            .Where(item => item.AccountId == accountId && item.DeactivatedAtUtc == null && item.Module == module)
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<Customer?> GetByIdAsync(Guid accountId, ProductModule module, Guid id, CancellationToken cancellationToken = default)
    {
        return context.Customers.SingleOrDefaultAsync(item => item.AccountId == accountId && item.DeactivatedAtUtc == null && item.Module == module && item.Id == id, cancellationToken);
    }

    public async Task AddAsync(Customer customer, CancellationToken cancellationToken = default)
    {
        await context.Customers.AddAsync(customer, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return context.SaveChangesAsync(cancellationToken);
    }
}
