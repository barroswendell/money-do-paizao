using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Interfaces;
using MoneyDoPaizao.Application.Loans;
using MoneyDoPaizao.Domain.Entities;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Application.Services;

public sealed class LoanService(
    ILoanRepository loanRepository,
    ICustomerRepository customerRepository,
    IManagedRecordStore records) : ILoanService
{
    public async Task<LoanResponse> CreateAsync(Guid accountId, LoanCreateRequest request, CancellationToken cancellationToken = default)
    {
        Validate(request);
        var customer = await FindCustomerAsync(accountId, request.CustomerId, cancellationToken);
        var loan = Loan.Create(accountId, request.CustomerId, request.PrincipalAmount, request.DueDay,
            request.MonthlyInterestRatePercent, request.LateDailyInterestRatePercent, request.Notes);
        loan.AttachCustomer(customer);

        await loanRepository.AddAsync(loan, cancellationToken);
        await loanRepository.SaveChangesAsync(cancellationToken);
        return Map(loan, DateTime.UtcNow);
    }

    public async Task<LoanResponse?> UpdateAsync(Guid accountId, Guid id, LoanCreateRequest request, CancellationToken cancellationToken = default)
    {
        var loan = await records.ChangeAsync<Loan>(accountId, ProductModule.Loans, id, async current =>
        {
            Validate(request);
            if ((current.Payments.Count > 0 || current.Status == LoanStatus.Paid) &&
                (current.CustomerId != request.CustomerId || current.PrincipalAmount != request.PrincipalAmount ||
                 current.DueDay != request.DueDay || current.MonthlyInterestRatePercent != request.MonthlyInterestRatePercent ||
                 current.LateDailyInterestRatePercent != request.LateDailyInterestRatePercent))
            {
                throw new BusinessValidationException("Empréstimos com pagamento registrado permitem alterar apenas a observação.");
            }

            var customer = current.CustomerId == request.CustomerId && current.Customer is not null
                ? current.Customer : await FindCustomerAsync(accountId, request.CustomerId, cancellationToken);
            current.Update(request.CustomerId, request.PrincipalAmount, request.DueDay,
                request.MonthlyInterestRatePercent, request.LateDailyInterestRatePercent, request.Notes);
            current.AttachCustomer(customer);
        }, cancellationToken);
        return loan is null ? null : Map(loan, DateTime.UtcNow);
    }

    private async Task<Customer> FindCustomerAsync(Guid accountId, Guid customerId, CancellationToken cancellationToken) =>
        await customerRepository.GetByIdAsync(accountId, ProductModule.Loans, customerId, cancellationToken)
            ?? throw new BusinessValidationException("O cliente selecionado não foi encontrado.");

    private static void Validate(LoanCreateRequest request)
    {
        if (request.PrincipalAmount <= 0 || request.PrincipalAmount > 9_999_999_999_999_999.99m ||
            request.PrincipalAmount != decimal.Round(request.PrincipalAmount, 2))
        {
            throw new BusinessValidationException("Informe um valor de empréstimo maior que zero, com até duas casas decimais.");
        }

        if (request.DueDay is < 1 or > 31)
        {
            throw new BusinessValidationException("O dia de vencimento deve estar entre 1 e 31.");
        }

        if (!IsRate(request.MonthlyInterestRatePercent) || !IsRate(request.LateDailyInterestRatePercent))
        {
            throw new BusinessValidationException("Informe taxas de juros entre zero e 9.999,9999, com até quatro casas decimais.");
        }
        if (request.Notes?.Trim().Length > 500)
        {
            throw new BusinessValidationException("A observação do empréstimo pode ter até 500 caracteres.");
        }
    }

    private static bool IsRate(decimal rate) => rate is >= 0 and <= 9999.9999m && decimal.Round(rate, 4) == rate;

    public async Task<IReadOnlyList<LoanResponse>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default)
    {
        var loans = await loanRepository.GetAllAsync(accountId, cancellationToken);
        var now = DateTime.UtcNow;
        return loans.Select(loan => Map(loan, now)).ToList();
    }

    public async Task<LoanResponse> RegisterPaymentAsync(Guid accountId, Guid id, LoanPaymentRequest request, CancellationToken cancellationToken = default, LoanPaymentAttachment? receipt = null)
    {
        var type = request.Type.Trim().Equals("Full", StringComparison.OrdinalIgnoreCase)
            ? LoanPaymentType.Full
            : request.Type.Trim().Equals("InterestOnly", StringComparison.OrdinalIgnoreCase)
                ? LoanPaymentType.InterestOnly
                : throw new BusinessValidationException("Tipo de pagamento inválido.");

        var loan = await loanRepository.RegisterPaymentAsync(accountId, id, currentLoan =>
        {
            if (request.RequestId is not null && currentLoan.Payments.Any(payment => payment.RequestId == request.RequestId))
            {
                return null;
            }

            if (currentLoan.Status == LoanStatus.Paid)
            {
                throw new BusinessValidationException("Este empréstimo já foi finalizado.");
            }

            var calculation = LoanCalculator.Calculate(currentLoan, DateTime.UtcNow);
            var payment = type == LoanPaymentType.Full
                ? LoanPayment.Create(accountId, id, type, calculation.TotalDue, calculation.InterestDue, currentLoan.PrincipalAmount, request.RequestId)
                : LoanPayment.Create(accountId, id, type, calculation.InterestDue, calculation.InterestDue, 0, request.RequestId);

            if (receipt is not null)
            {
                payment.AttachReceipt(receipt.Name, receipt.ContentType, receipt.Content);
            }

            if (type == LoanPaymentType.Full)
            {
                currentLoan.MarkAsPaid();
            }

            return payment;
        }, cancellationToken) ?? throw new BusinessValidationException("Empréstimo não encontrado.");
        return Map(loan, DateTime.UtcNow);
    }

    public Task<LoanPaymentAttachment?> GetPaymentReceiptAsync(Guid accountId, Guid id, Guid paymentId, CancellationToken cancellationToken = default)
    {
        return loanRepository.GetPaymentReceiptAsync(accountId, id, paymentId, cancellationToken);
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
            loan.Payments.Sum(payment => payment.InterestAmount),
            loan.Payments
                .OrderByDescending(payment => payment.PaidAtUtc)
                .Select(payment => new LoanPaymentResponse(
                    payment.Id,
                    payment.Type.ToString(),
                    payment.Amount,
                    payment.InterestAmount,
                    payment.PrincipalAmount,
                    payment.PaidAtUtc,
                    payment.ReceiptName))
                .ToList(),
            loan.Notes);
    }
}

public interface ILoanService
{
    Task<LoanResponse> CreateAsync(Guid accountId, LoanCreateRequest request, CancellationToken cancellationToken = default);
    Task<LoanResponse?> UpdateAsync(Guid accountId, Guid id, LoanCreateRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LoanResponse>> GetAllAsync(Guid accountId, CancellationToken cancellationToken = default);
    Task<LoanResponse> RegisterPaymentAsync(Guid accountId, Guid id, LoanPaymentRequest request, CancellationToken cancellationToken = default, LoanPaymentAttachment? receipt = null);
    Task<LoanPaymentAttachment?> GetPaymentReceiptAsync(Guid accountId, Guid id, Guid paymentId, CancellationToken cancellationToken = default);
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
