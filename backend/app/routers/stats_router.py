from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
import io

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get('/matplotlib.png')
def matplotlib_plot():
    """Generate a simple matplotlib plot and return it as PNG.

    This endpoint is intended as an example of server-side chart generation
    using matplotlib. It produces a sample pie + bar combined figure.
    """
    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import numpy as np
    except Exception as e:
        return Response(content=f"matplotlib not available: {e}", status_code=500)

    # Sample data
    categories = ['Food', 'Rent', 'Transport', 'Shopping', 'Savings']
    values = [320, 800, 120, 200, 560]

    fig, axs = plt.subplots(1, 2, figsize=(8, 3))
    # Pie chart
    axs[0].pie(values, labels=categories, autopct='%1.1f%%', startangle=140)
    axs[0].set_title('Spending by Category')

    # Bar chart
    x = np.arange(len(categories))
    axs[1].bar(x, values, color=['#4c9f70', '#d95f02', '#7570b3', '#1b9e77', '#e7298a'])
    axs[1].set_xticks(x)
    axs[1].set_xticklabels(categories, rotation=45, ha='right')
    axs[1].set_title('Spending (USD)')

    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=100)
    plt.close(fig)
    buf.seek(0)

    return StreamingResponse(content=buf, media_type='image/png')
