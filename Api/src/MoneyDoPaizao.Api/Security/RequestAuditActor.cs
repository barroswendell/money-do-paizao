using System.Security.Claims;
using MoneyDoPaizao.Application.Interfaces;

namespace MoneyDoPaizao.Api.Security;

public sealed class RequestAuditActor(IHttpContextAccessor accessor) : IAuditActor
{
    public AuditActor? Current
    {
        get
        {
            var user = accessor.HttpContext?.User;
            return user?.Identity?.IsAuthenticated == true && Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
                ? new AuditActor(id, user.Identity.Name ?? "Usuário")
                : null;
        }
    }
}
