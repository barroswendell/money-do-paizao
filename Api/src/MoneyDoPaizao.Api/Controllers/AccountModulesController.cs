using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MoneyDoPaizao.Application.Auth;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Services;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/account/modules")]
public sealed class AccountModulesController(IAccountModuleService accountModuleService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetModules(CancellationToken cancellationToken)
    {
        return Ok(await accountModuleService.GetModulesAsync(AccountId, cancellationToken));
    }

    [HttpPost("activate")]
    public async Task<IActionResult> Activate(ActivateModuleRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await accountModuleService.ActivateAsync(UserId, request.Module, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
