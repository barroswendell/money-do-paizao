using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Loans;
using MoneyDoPaizao.Application.Services;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/loans")]
public sealed class LoansController(ILoanService loanService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await loanService.GetAllAsync(cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(LoanCreateRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Created("api/loans", await loanService.CreateAsync(request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/payments")]
    public async Task<IActionResult> RegisterPayment(Guid id, LoanPaymentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await loanService.RegisterPaymentAsync(id, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
