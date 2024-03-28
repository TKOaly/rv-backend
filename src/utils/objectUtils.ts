export const deleteUndefinedFields = (obj) => {
	for (const key of Object.keys(obj)) {
		if (obj[key] === undefined) {
			delete obj[key];
		}
	}
	return obj;
};
