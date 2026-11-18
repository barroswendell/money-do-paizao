using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Finance;
using MoneyDoPaizao.Application.Services;
using System.Security.Claims;
using MoneyDoPaizao.Api.Security;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/personal-finance")]
public sealed class PersonalFinanceController(IPersonalFinanceService financeService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(CancellationToken cancellationToken)
    {
        if (!User.HasModule("PersonalFinance")) return Forbid();
        return Ok(await financeService.GetSummaryAsync(AccountId, cancellationToken));
    }

    [HttpGet("entries")]
    public async Task<IActionResult> Entries(CancellationToken cancellationToken)
    {
        if (!User.HasModule("PersonalFinance")) return Forbid();
        return Ok(await financeService.GetEntriesAsync(AccountId, cancellationToken));
    }

    [HttpPost("entries")]
    public async Task<IActionResult> Create(FinanceEntryCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("PersonalFinance")) return Forbid();
        try
        {
            return Created("api/personal-finance/entries", await financeService.CreateAsync(AccountId, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
