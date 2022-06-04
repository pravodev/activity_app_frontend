export function showSnackBar(text, duration = 3) {
    var snackbarEl = $($.parseHTML('<div class="show" id="snackbar" style="z-index:99999999999999999">' + text + '</div>'));
    $("body").append(snackbarEl);
    setTimeout(function () { snackbarEl.removeClass("show"); }, 3000);
}

export function showError(text) {
    return Swal.fire({
        title: 'Error',
        text: text,
        icon: 'error',
    });
}

export function showSuccess(text) {
    return Swal.fire({
        title: 'Success',
        text: text,
        icon: 'success',
    });
}

export function showWarning(text) {
    return Swal.fire({
        title: 'Warning',
        text: text,
        icon: 'warning'
    })
}

export async function showConfirmation(text, options = {}) {
    return Swal.fire({
        title: 'Are you sure?',
        text: text,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonColor: '#3085d6',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Delete',
        dangerMode: true,
        reverseButtons: true,
        ...options,
    });
}