using System.Security.Claims;

namespace MoneyDoPaizao.Api.Security;

public static class ModuleAuthorization
{
    public static bool HasModule(this ClaimsPrincipal user, string module)
    {
        return string.Equals(user.FindFirstValue("module"), module, StringComparison.OrdinalIgnoreCase);
    }
}
