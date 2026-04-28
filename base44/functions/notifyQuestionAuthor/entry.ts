import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const answer = payload.data;
        if (!answer) {
            return Response.json({ error: 'No answer data provided' }, { status: 400 });
        }

        const question = await base44.asServiceRole.entities.Question.get(answer.question_id);
        if (!question) {
            return Response.json({ error: 'Question not found' }, { status: 404 });
        }

        // Don't notify if the answerer is the question author
        if (answer.created_by === question.created_by) {
            return Response.json({ message: 'Author answered their own question, skipping notification' });
        }

        await base44.asServiceRole.entities.Notification.create({
            recipient_email: question.created_by,
            sender_email: answer.created_by,
            sender_name: answer.author_name,
            type: 'comment',
            content: `${answer.author_name} answered your question: "${question.title}"`,
            post_id: question.id,
            is_read: false,
        });

        return Response.json({ success: true, message: 'Notification sent to question author' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});