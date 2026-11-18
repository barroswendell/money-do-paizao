using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Loans;
using MoneyDoPaizao.Application.Services;
using MoneyDoPaizao.Api.Security;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/loans")]
public sealed class LoansController(ILoanService loanService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        return Ok(await loanService.GetAllAsync(AccountId, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(LoanCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        try
        {
            return Created("api/loans", await loanService.CreateAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/payments")]
    public async Task<IActionResult> RegisterPayment(Guid id, LoanPaymentRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        try
        {
            return Ok(await loanService.RegisterPaymentAsync(AccountId, id, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
