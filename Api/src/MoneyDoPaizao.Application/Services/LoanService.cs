using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Loans;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class LoanService(
    ILoanRepository loanRepository,
    ICustomerRepository customerRepository) : ILoanService
{
    public async Task<LoanResponse> CreateAsync(LoanCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (request.PrincipalAmount <= 0)
        {
            throw new BusinessValidationException("Informe um valor de empréstimo maior que zero.");
        }

        if (request.DueDay is < 1 or > 31)
        {
            throw new BusinessValidationException("O dia de vencimento deve estar entre 1 e 31.");
        }

        if (request.MonthlyInterestRatePercent < 0 || request.LateDailyInterestRatePercent < 0)
        {
            throw new BusinessValidationException("As taxas de juros não podem ser negativas.");
        }

        var customer = await customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer is null)
        {
            throw new BusinessValidationException("O cliente selecionado não foi encontrado.");
        }

        var loan = Loan.Create(
            request.CustomerId,
            request.PrincipalAmount,
            request.DueDay,
            request.MonthlyInterestRatePercent,
            request.LateDailyInterestRatePercent);

        await loanRepository.AddAsync(loan, cancellationToken);
        await loanRepository.SaveChangesAsync(cancellationToken);
        loan.AttachCustomer(customer);
        return Map(loan, DateTime.UtcNow);
    }

    public async Task<IReadOnlyList<LoanResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var loans = await loanRepository.GetAllAsync(cancellationToken);
        var now = DateTime.UtcNow;
        return loans.Select(loan => Map(loan, now)).ToList();
    }

    public async Task<LoanResponse> RegisterPaymentAsync(Guid id, LoanPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var loan = await loanRepository.GetByIdAsync(id, cancellationToken);
        if (loan is null)
        {
            throw new BusinessValidationException("Empréstimo não encontrado.");
        }

        if (loan.Status == LoanStatus.Paid)
        {
            throw new BusinessValidationException("Este empréstimo já foi finalizado.");
        }

        var type = request.Type.Trim().Equals("Full", StringComparison.OrdinalIgnoreCase)
            ? LoanPaymentType.Full
            : request.Type.Trim().Equals("InterestOnly", StringComparison.OrdinalIgnoreCase)
                ? LoanPaymentType.InterestOnly
                : throw new BusinessValidationException("Tipo de pagamento inválido.");

        var calculation = LoanCalculator.Calculate(loan, DateTime.UtcNow);
        var payment = type == LoanPaymentType.Full
            ? LoanPayment.Create(loan.Id, type, calculation.TotalDue, calculation.InterestDue, loan.PrincipalAmount)
            : LoanPayment.Create(loan.Id, type, calculation.InterestDue, calculation.InterestDue, 0);

        await loanRepository.AddPaymentAsync(payment, cancellationToken);
        if (type == LoanPaymentType.Full)
        {
            loan.MarkAsPaid();
        }

        await loanRepository.SaveChangesAsync(cancellationToken);
        return Map(loan, DateTime.UtcNow);
    }

    private static LoanResponse Map(Loan loan, DateTime now)
    {
        var calculation = LoanCalculator.Calculate(loan, now);
        return new LoanResponse(
            loan.Id,
            loan.CustomerId,
            loan.Customer?.Name ?? "Cliente",
            loan.PrincipalAmount,
            loan.DueDay,
            loan.MonthlyInterestRatePercent,
            loan.LateDailyInterestRatePercent,
            calculation.DueDate,
            calculation.DaysLate,
            calculation.InterestDue,
            calculation.TotalDue,
            loan.Status.ToString(),
            loan.Payments.Sum(payment => payment.InterestAmount));
    }
}

public interface ILoanService
{
    Task<LoanResponse> CreateAsync(LoanCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LoanResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<LoanResponse> RegisterPaymentAsync(Guid id, LoanPaymentRequest request, CancellationToken cancellationToken = default);
}

public static class LoanCalculator
{
    public static LoanCalculation Calculate(Loan loan, DateTime now)
    {
        var lastDayOfMonth = DateTime.DaysInMonth(now.Year, now.Month);
        var dueDate = new DateTime(now.Year, now.Month, Math.Min(loan.DueDay, lastDayOfMonth));
        var daysLate = Math.Max(0, (now.Date - dueDate.Date).Days);
        var monthlyInterest = loan.PrincipalAmount * loan.MonthlyInterestRatePercent / 100m;
        var dailyMultiplier = 1m + loan.LateDailyInterestRatePercent / 100m;
        var lateMultiplier = (decimal)Math.Pow((double)dailyMultiplier, daysLate);
        var interestDue = Math.Round(monthlyInterest * lateMultiplier, 2, MidpointRounding.AwayFromZero);
        return new LoanCalculation(dueDate, daysLate, interestDue, loan.PrincipalAmount + interestDue);
    }
}

public sealed record LoanCalculation(DateTime DueDate, int DaysLate, decimal InterestDue, decimal TotalDue);
