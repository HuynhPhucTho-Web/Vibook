import Carousel from "react-bootstrap/Carousel";
import "../style/VideoCarousel.css";

function VideoCarousel() {
    return (
        <Carousel data-bs-theme="dark" interval={10000}>
            <Carousel.Item>
                <video
                    className="d-block w-100 video-carousel-item-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/intro.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>ViBook</h5>
                    <p>A little introduction</p>
                </Carousel.Caption>
            </Carousel.Item>

            <Carousel.Item>
                <video
                    className="d-block w-100 video-carousel-item-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/intro.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Post</h5>
                    <p>What mood are you in?</p>
                </Carousel.Caption>
            </Carousel.Item>

            <Carousel.Item>
                <video
                    className="d-block w-100 video-carousel-item-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/introgroup.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Group</h5>
                    <p>Create a group for your friends</p>
                </Carousel.Caption>
            </Carousel.Item>

            <Carousel.Item>
                <video
                    className="d-block w-100 video-carousel-item-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/introstory.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Story</h5>
                    <p>Express your emotions anytime, anywhere</p>
                </Carousel.Caption>
            </Carousel.Item>

             <Carousel.Item>
                <video
                    className="d-block w-100 video-carousel-item-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/introgame.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Games</h5>
                    <p>Have fun with new games</p>
                </Carousel.Caption>
            </Carousel.Item>

             <Carousel.Item>
                <video
                    className="d-block w-100 video-carousel-item-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                >
                    <source src="/videos/introevent.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Events</h5>
                    <p>Interesting friends events</p>
                </Carousel.Caption>
            </Carousel.Item>
        </Carousel>
    );
}

export default VideoCarousel;
