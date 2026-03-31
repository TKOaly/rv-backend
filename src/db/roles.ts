// These should not be changed as database already contains data with the ids
export const roles = {
	ADMIN: 1,
	USER: 2,
	NOEMAIL: 6,
	INACTIVE: 7
}

export const getRole = (roleid: Number) : String => {
	switch (roleid) {
		case roles.ADMIN:
			return 'ADMIN';
		case roles.NOEMAIL:
			return 'NOEMAIL';
		case roles.INACTIVE:
			return 'INACTIVE';
		default:
			return 'USER';
		}
}
				
export const getRoleId = (role: String) : Number => {
	switch (role) {
		case 'ADMIN':
			return roles.ADMIN;
		case 'NOEMAIL':
			return roles.NOEMAIL;
		case 'INACTIVE':
			return roles.INACTIVE;
		default:
			return roles.USER;
	}
}
