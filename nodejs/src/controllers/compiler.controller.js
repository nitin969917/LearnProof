const compilerService = require('../services/compiler.service');

exports.runCode = async (req, res) => {
    try {
        const { language, code, stdin } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Code is required'
            });
        }

        const result = await compilerService.executeCode({
            language: language || 'python',
            code,
            stdin: stdin || ''
        });

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error('[Compiler Controller] Error executing code:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Execution failed'
        });
    }
};

exports.convertCode = async (req, res) => {
    try {
        const { code, fromLanguage, toLanguage } = req.body;
        if (!code || !toLanguage) {
            return res.status(400).json({
                success: false,
                message: 'Code and target language are required'
            });
        }

        const result = await compilerService.convertCodeSnippet({
            code,
            fromLanguage: fromLanguage || 'code',
            toLanguage
        });

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (err) {
        console.error('[Compiler Controller] Error converting code:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Code conversion failed'
        });
    }
};
