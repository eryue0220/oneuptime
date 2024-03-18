import 'ejs';
import Express, {
    ExpressRequest,
    ExpressResponse,
    ExpressStatic,
    ExpressApplication,
} from 'CommonServer/Utils/Express';
import { ContentPath, StaticPath, ViewsPath } from './Utils/Config';
import DocsNav, { NavGroup, NavLink } from './Utils/Nav';
import LocalFile from 'CommonServer/Utils/LocalFile';
import DocsRender from './Utils/Render';

const app: ExpressApplication = Express.getExpressApp();

app.get('/docs', (_req: ExpressRequest, res: ExpressResponse) => {
    res.redirect('/docs/introduction/getting-started');
});

app.get('/docs/:categorypath/:pagepath', async (_req: ExpressRequest, res: ExpressResponse) => {

    try {

        const fullPath: string = `${_req.params['categorypath']}/${_req.params['pagepath']}`.toLowerCase();

        // read file from Content folder. 
        const contentInMarkdown = await LocalFile.read(`${ContentPath}/${fullPath}.md`);

        const renderedContent = DocsRender.render(contentInMarkdown);

        const currentCategory: NavGroup | undefined = DocsNav.find((category) => {
            return category.links.find((link) => {
                return link.url === fullPath;
            });
        });


        const currrentNavLink: NavLink | undefined = currentCategory?.links.find((link) => {
            return link.url === fullPath;
        });


        if (!currentCategory || !currrentNavLink) {
            // render not found. 

            res.status(404);
            return res.render(`${ViewsPath}/NotFound`, {
                nav: DocsNav,
            });
        }


        res.render(`${ViewsPath}/Index`, {
            nav: DocsNav,
            content: renderedContent,
            currentCategory: currentCategory,
            currentNavLink: currrentNavLink
        });

    } catch (err) {
        res.status(500);
        return res.render(`${ViewsPath}/ServerError`, {
            nav: DocsNav,
        });
    }
});

app.use('/docs/static', ExpressStatic(StaticPath));
