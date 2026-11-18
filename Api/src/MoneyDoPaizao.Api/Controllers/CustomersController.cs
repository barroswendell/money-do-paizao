using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MoneyDoPaizao.Application.Customers;
using MoneyDoPaizao.Application.Exceptions;
using MoneyDoPaizao.Application.Services;
using MoneyDoPaizao.Api.Security;
using MoneyDoPaizao.Domain.Enums;

namespace MoneyDoPaizao.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/customers")]
public sealed class CustomersController(ICustomerService customerService) : ControllerBase
{
    private Guid AccountId => Guid.Parse(User.FindFirstValue("accountId")!);
    private ProductModule CurrentModule => Enum.Parse<ProductModule>(User.FindFirstValue("module")!);

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans") && !User.HasModule("Parties") && !User.HasModule("Sales")) return Forbid();
        return Ok(await customerService.GetAllAsync(AccountId, CurrentModule, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CustomerCreateRequest request, CancellationToken cancellationToken)
    {
        if (!User.HasModule("Loans") && !User.HasModule("Parties") && !User.HasModule("Sales")) return Forbid();
        try
        {
            return Created("api/customers", await customerService.CreateAsync(AccountId, CurrentModule, request, cancellationToken));
        }
        catch (BusinessValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}
