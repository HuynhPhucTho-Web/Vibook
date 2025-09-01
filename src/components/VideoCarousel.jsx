import Carousel from "react-bootstrap/Carousel";

function VideoCarousel() {
    return (
        <Carousel data-bs-theme="dark" interval={5000}> {/* interval = 5000ms = 5s */}
            <Carousel.Item>
                <video
                    className="d-block w-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                        height: "300px",   
                        objectFit: "cover" 
                    }}
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
                    className="d-block w-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                     style={{
                        height: "300px",   
                        objectFit: "cover" 
                    }}
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
                    className="d-block w-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                     style={{
                        height: "300px",   
                        objectFit: "cover" 
                    }}
                >
                    <source src="/videos/intro.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Group</h5>
                    <p>Create a group for your friends</p>
                </Carousel.Caption>
            </Carousel.Item>

            <Carousel.Item>
                <video
                    className="d-block w-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                     style={{
                        height: "300px",   
                        objectFit: "cover" 
                    }}
                >
                    <source src="/videos/intro2.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Story</h5>
                    <p>Express your emotions anytime, anywhere</p>
                </Carousel.Caption>
            </Carousel.Item>

             <Carousel.Item>
                <video
                    className="d-block w-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                        height: "300px",   
                        objectFit: "cover" 
                    }}
                >
                    <source src="/intro1.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <Carousel.Caption>
                    <h5>Games</h5>
                    <p>Have fun with new games</p>
                </Carousel.Caption>
            </Carousel.Item>

             <Carousel.Item>
                <video
                    className="d-block w-100"
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{
                        height: "300px",   
                        objectFit: "cover" 
                    }}
                >
                    <source src="/videos/intro.mp4" type="video/mp4" />
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
