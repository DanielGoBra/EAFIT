"""
Script de migración: lee seed_materiales.json y genera el payload
para importar items a una SharePoint List via Microsoft Graph API.

Uso:
  python migrate_to_sharepoint.py \
    --tenant-id  <TU_TENANT_ID>  \
    --client-id  <TU_CLIENT_ID>  \
    --client-sec <TU_SECRET>     \
    --site-url   https://<tenant>.sharepoint.com/sites/<site>

Requiere:
  pip install requests msal
"""

import argparse, json, sys, time
from pathlib import Path

try:
    import requests
    import msal
except ImportError:
    print("Instala dependencias: pip install requests msal")
    sys.exit(1)

SEED_FILE = Path(__file__).parent / "seed_materiales.json"
LIST_NAME = "Materiales"


def get_token(tenant_id: str, client_id: str, client_secret: str) -> str:
    app = msal.ConfidentialClientApplication(
        client_id,
        authority=f"https://login.microsoftonline.com/{tenant_id}",
        client_credential=client_secret,
    )
    result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])
    if "access_token" not in result:
        raise RuntimeError(f"Error de autenticación: {result.get('error_description')}")
    return result["access_token"]


def get_site_id(token: str, site_url: str) -> str:
    host = site_url.split("/")[2]
    path = "/".join(site_url.split("/")[3:])
    r = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{host}:/{path}",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    return r.json()["id"]


def get_list_id(token: str, site_id: str, list_name: str) -> str:
    r = requests.get(
        f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists",
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    for lst in r.json().get("value", []):
        if lst["displayName"].lower() == list_name.lower():
            return lst["id"]
    raise RuntimeError(f"Lista '{list_name}' no encontrada en el sitio.")


def crear_item(token: str, site_id: str, list_id: str, item: dict) -> dict:
    fields = {
        "Title":               item["nombre"],
        "Categoria":           item["categoria"],
        "Subcategoria":        item["subcategoria"],
        "CantidadTotal":       item["cantidadTotal"],
        "CantidadDisponible":  item["cantidadDisponible"],
        "Condicion":           item["condicion"],
        "Estado":              item["estado"],
        "Descripcion":         item["descripcion"][:255],   # SP text limit
        "Observaciones":       item["observaciones"][:255],
    }
    r = requests.post(
        f"https://graph.microsoft.com/v1.0/sites/{site_id}/lists/{list_id}/items",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json",
        },
        json={"fields": fields},
    )
    r.raise_for_status()
    return r.json()


def main():
    parser = argparse.ArgumentParser(description="Migra materiales EAFIT a SharePoint")
    parser.add_argument("--tenant-id",  required=True)
    parser.add_argument("--client-id",  required=True)
    parser.add_argument("--client-sec", required=True)
    parser.add_argument("--site-url",   required=True)
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra items, no crea en SP")
    args = parser.parse_args()

    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    items = data["materiales"]
    print(f"📦 {len(items)} materiales encontrados en seed_materiales.json")

    if args.dry_run:
        for i in items[:5]:
            print(f"  • [{i['categoria']}] {i['nombre']} — {i['condicion']}")
        print("  ... (dry-run, no se creó nada)")
        return

    print("🔐 Obteniendo token de Microsoft Graph...")
    token = get_token(args.tenant_id, args.client_id, args.client_sec)

    print("🌐 Obteniendo IDs de sitio y lista...")
    site_id = get_site_id(token, args.site_url)
    list_id = get_list_id(token, site_id, LIST_NAME)
    print(f"   site_id: {site_id}")
    print(f"   list_id: {list_id}")

    ok, err = 0, 0
    for i, item in enumerate(items, 1):
        try:
            crear_item(token, site_id, list_id, item)
            print(f"  [{i:3}/{len(items)}] ✓ {item['nombre'][:50]}")
            ok += 1
        except Exception as e:
            print(f"  [{i:3}/{len(items)}] ✗ {item['nombre'][:50]} — {e}")
            err += 1
        time.sleep(0.3)   # throttle: Graph API rate limit

    print(f"\n✅ {ok} creados  |  ❌ {err} errores")


if __name__ == "__main__":
    main()
