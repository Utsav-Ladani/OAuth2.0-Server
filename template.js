import fs from 'fs';

const getResponseMarkupFromTemplate = (name, data) => {
    const filePath = `./pages/${name}.html`
    let templateContent = fs.readFileSync(filePath).toString();

    for (const [key, value] of Object.entries(data)) {
        templateContent = templateContent.replaceAll(`{{${key}}}`, value)
    }

    return templateContent
}

export { getResponseMarkupFromTemplate }