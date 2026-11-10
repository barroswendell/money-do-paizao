using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class LoanRepository(MoneyDoPaizaoDbContext context) : ILoanRepository
{
    public async Task<IReadOnlyList<Loan>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .Include(item => item.Customer)
            .Include(item => item.Payments)
            .AsNoTracking()
            .OrderByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public Task<Loan?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return context.Loans
            .Include(item => item.Customer)
            .Include(item => item.Payments)
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
    }

    public async Task AddAsync(Loan loan, CancellationToken cancellationToken = default)
    {
        await context.Loans.AddAsync(loan, cancellationToken);
    }

    public async Task AddPaymentAsync(LoanPayment payment, CancellationToken cancellationToken = default)
    {
        await context.LoanPayments.AddAsync(payment, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return context.SaveChangesAsync(cancellationToken);
    }
}
