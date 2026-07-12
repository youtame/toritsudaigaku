import { relations } from "drizzle-orm/relations";
import { users, files, filePermissions } from "./schema";

export const filesRelations = relations(files, ({one, many}) => ({
	user: one(users, {
		fields: [files.userId],
		references: [users.id]
	}),
	filePermissions: many(filePermissions),
}));

export const usersRelations = relations(users, ({many}) => ({
	files: many(files),
	filePermissions: many(filePermissions),
}));

export const filePermissionsRelations = relations(filePermissions, ({one}) => ({
	file: one(files, {
		fields: [filePermissions.fileId],
		references: [files.id]
	}),
	user: one(users, {
		fields: [filePermissions.userId],
		references: [users.id]
	}),
}));