using Microsoft.EntityFrameworkCore;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Loans;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Infrastructure.Persistence;

namespace MoneyDoPaizao.Infrastructure.Repositories;

public sealed class LoanRepository(MoneyDoPaizaoDbContext context) : ILoanRepository
{
    public async Task<IReadOnlyList<Loan>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        return await context.Loans
            .Include(item => item.Customer)
            .Include(item => item.Payments)
            .Where(item => item.AccountId == accountId)
            .AsNoTracking()
            .OrderByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Loan?> RegisterPaymentAsync(Guid accountId, Guid id, Func<Loan, LoanPayment?> registerPayment, CancellationToken cancellationToken = default)
    {
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        // Read the payment history after locking the loan so concurrent requests see each other's updates.
        var loan = await context.Loans
            .FromSql($"SELECT * FROM loans WHERE account_id = {accountId} AND id = {id} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);
        if (loan is null)
        {
            return null;
        }

        await context.Entry(loan).Reference(item => item.Customer).LoadAsync(cancellationToken);
        await context.Entry(loan).Collection(item => item.Payments).LoadAsync(cancellationToken);

        var payment = registerPayment(loan);
        if (payment is not null)
        {
            context.LoanPayments.Add(payment);
            await context.SaveChangesAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return loan;
    }

    public Task<LoanPaymentAttachment?> GetPaymentReceiptAsync(Guid accountId, Guid id, Guid paymentId, CancellationToken cancellationToken = default)
    {
        return context.LoanPayments
            .Where(item => item.LoanId == id && item.Id == paymentId &&
                item.AccountId == accountId && item.Loan!.AccountId == accountId && item.Receipt != null)
            .Select(item => new LoanPaymentAttachment(item.ReceiptName!, item.Receipt!.ContentType, item.Receipt.Content))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task AddAsync(Loan loan, CancellationToken cancellationToken = default)
    {
        await context.Loans.AddAsync(loan, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return context.SaveChangesAsync(cancellationToken);
    }
}
