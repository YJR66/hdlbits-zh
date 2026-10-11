#!/bin/sh
# RPM calls %postun with 1 for the old package during an upgrade. Only refresh
# caches after a final uninstall; never remove another version's launcher/data.
if [ "${1:-0}" -ne 0 ]; then
    exit 0
fi
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database -q /usr/share/applications || :
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || :
fi
exit 0
