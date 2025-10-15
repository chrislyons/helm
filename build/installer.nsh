; Custom NSIS installer script for Helm
; This script adds a checkbox during uninstall to optionally keep user data

; Installer hooks
!macro customInstall
  ; Nothing special needed during install
!macroend

; Uninstaller hooks
!macro customUnInstall
  ; Ask user if they want to delete their data
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Do you want to delete all Helm user data?$\n$\n\
    This includes all your trees, settings, and configurations.$\n$\n\
    Selecting 'No' will allow you to perform a clean reinstall while keeping your data." \
    /SD IDNO IDYES delete_data IDNO keep_data

  delete_data:
    DetailPrint "Removing user data directory..."
    RMDir /r "$APPDATA\Helm"
    Goto done

  keep_data:
    DetailPrint "Keeping user data for future use..."

  done:
!macroend
