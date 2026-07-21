const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, '../src/lib/api.ts');
let content = fs.readFileSync(apiPath, 'utf8');

// Replace Promise<ApiResponse<any>> -> Promise<ApiResponse<TResponse>>
// But we need to add <TResponse = unknown> to the method signature.
// This is best done manually or via a smart regex.

// Let's just use string replacements for common patterns.
// For example:
// static async getSuratById(id: string): Promise<ApiResponse<any>> {
// -> static async getSuratById<TResponse = unknown>(id: string): Promise<ApiResponse<TResponse>> {

// I will write a regex that catches static async methods.
const methodRegex = /static\s+async\s+(\w+)\s*\(([^)]*)\)\s*:\s*Promise<ApiResponse<any(?:\[\])?>>/g;

content = content.replace(methodRegex, (match, methodName, args) => {
    // If it has `any[]`, we might want TResponse[] or just let TResponse handle the array.
    // Let's let TResponse handle the array if the user passes it.
    // Wait, if the original was Promise<ApiResponse<any[]>>, then it should be TResponse[].
    const isArray = match.includes('any[]');
    
    // Also we need to replace `data: any` in args with `data: TRequest`
    let newArgs = args;
    let typeParams = '<TResponse = unknown>';
    if (args.includes('data: any') || args.includes('students: any[]') || args.includes('scoring: any')) {
        newArgs = args.replace(/(\w+)\s*:\s*any(?:\[\])?/, '$1: TRequest');
        typeParams = '<TResponse = unknown, TRequest = unknown>';
    }

    const retType = isArray ? `Promise<ApiResponse<TResponse[]>>` : `Promise<ApiResponse<TResponse>>`;
    
    return `static async ${methodName}${typeParams}(${newArgs}): ${retType}`;
});

// Also replace `this.request<any>` -> `this.request<TResponse>`
// and `this.request<any[]>` -> `this.request<TResponse[]>`
content = content.replace(/this\.request<any(?:\[\])?>/g, (match) => {
    if (match.includes('[]')) return 'this.request<TResponse[]>';
    return 'this.request<TResponse>';
});

// For switchRole which returns { data: { token: '', activeContext: null } }
content = content.replace(
    `static async switchRole(assignmentId: string): Promise<ApiResponse<any>>`,
    `static async switchRole<TResponse = unknown>(assignmentId: string): Promise<ApiResponse<TResponse>>`
);

// We still might have some `any` left in non-async methods or other places.
// E.g., `template: any` in src/lib/types/surat.ts
fs.writeFileSync(apiPath, content);
console.log('api.ts processed');
