using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MoneyDoPaizao.Application.Services;
using MoneyDoPaizao.Api.Security;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans")) return Forbid();
        return Ok(await dashboardService.GetAsync(AccountId, cancellationToken));
    }
}
