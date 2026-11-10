using MoneyDoPaizao.Application.Dashboard;
using MoneyDoPaizao.Application.Interfaces;

namespace MoneyDoPaizao.Application.Services;

public sealed class DashboardService(
    ICustomerRepository customerRepository,
    ILoanRepository loanRepository) : IDashboardService
{
    public async Task<DashboardResponse> GetAsync(CancellationToken cancellationToken = default)
    {
        var customers = await customerRepository.GetAllAsync(cancellationToken);
        var loans = await loanRepository.GetAllAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var activeLoans = loans.Where(loan => loan.Status == Domain.Enums.LoanStatus.Active).ToList();
        var overdueCustomerIds = activeLoans
            .Where(loan => LoanCalculator.Calculate(loan, now).DaysLate > 0)
            .Select(loan => loan.CustomerId)
            .Distinct()
            .ToHashSet();
        var onTimeCustomerIds = activeLoans
            .Where(loan => LoanCalculator.Calculate(loan, now).DaysLate == 0)
            .Select(loan => loan.CustomerId)
            .Distinct()
            .ToHashSet();

        return new DashboardResponse(
            customers.Count,
            activeLoans.Sum(loan => loan.PrincipalAmount),
            loans.SelectMany(loan => loan.Payments).Sum(payment => payment.InterestAmount),
            onTimeCustomerIds.Count,
            overdueCustomerIds.Count);
    }
}

public interface IDashboardService
{
    Task<DashboardResponse> GetAsync(CancellationToken cancellationToken = default);
}
